import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(ROOT, "sticky-purchase.js"), "utf8");

class Element {
  constructor(rect = { top: 1000, bottom: 1048 }) {
    this.rect = rect;
    this.textContent = "";
    this.attributes = {};
    this.listeners = new Map();
    this.clickCount = 0;
    this.classes = new Set();
    this.classList = {
      toggle: (name, enabled) => {
        if (enabled) this.classes.add(name);
        else this.classes.delete(name);
      },
      contains: (name) => this.classes.has(name),
    };
  }

  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) || [];
    callbacks.push(callback);
    this.listeners.set(type, callbacks);
  }

  removeEventListener(type, callback) {
    const callbacks = this.listeners.get(type) || [];
    this.listeners.set(type, callbacks.filter((entry) => entry !== callback));
  }

  dispatch(type) {
    for (const callback of this.listeners.get(type) || []) callback();
  }

  click() {
    this.clickCount += 1;
    this.dispatch("click");
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

function createWindow({ mobile = true, observer = true } = {}) {
  const listeners = new Map();
  let intersectionObserver = null;
  const value = {
    innerHeight: 800,
    matchMedia(query) {
      assert.equal(query, "(max-width: 760px)");
      return { matches: mobile };
    },
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || [];
      callbacks.push(callback);
      listeners.set(type, callbacks);
    },
    removeEventListener(type, callback) {
      const callbacks = listeners.get(type) || [];
      listeners.set(type, callbacks.filter((entry) => entry !== callback));
    },
    dispatch(type) {
      for (const callback of listeners.get(type) || []) callback();
    },
  };

  if (observer) {
    value.IntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        intersectionObserver = this;
      }
      observe(target) {
        this.target = target;
      }
      disconnect() {
        this.disconnected = true;
      }
      trigger(isIntersecting) {
        this.callback([{ isIntersecting }], this);
      }
    };
  }

  return {
    value,
    listeners,
    get observer() { return intersectionObserver; },
    set mobile(enabled) { mobile = enabled; },
  };
}

function initialize(windowObject, selection) {
  vm.runInNewContext(source, { window: windowObject });
  const bar = new Element();
  const button = new Element();
  const sourceButton = new Element();
  const nameTarget = new Element();
  const summaryTarget = new Element();
  const controller = windowObject.SantinoStickyPurchase.init({
    bar,
    button,
    sourceButton,
    nameTarget,
    summaryTarget,
    getSelection: () => selection.current,
    formatPrice: (price) => `R$ ${price.toFixed(2).replace(".", ",")}`,
  });
  return { bar, button, sourceButton, nameTarget, summaryTarget, controller };
}

test("purchase summary shows the selected volume, quantity, and current unit price", () => {
  const browser = createWindow();
  const selection = {
    current: { name: "Exemplo", volume: 5, quantity: 2, price: 18.9, consultation: false },
  };
  const ui = initialize(browser.value, selection);

  assert.equal(ui.nameTarget.textContent, "Exemplo");
  assert.equal(ui.summaryTarget.textContent, "5 ml · Qtd. 2 · R$ 18,90");
  assert.equal(ui.button.textContent, "Adicionar");
  assert.equal(ui.bar.classList.contains("is-visible"), true);
  assert.equal(ui.bar.attributes["aria-hidden"], "false");

  ui.button.click();
  assert.equal(ui.sourceButton.clickCount, 1);

  browser.observer.trigger(true);
  assert.equal(ui.bar.classList.contains("is-visible"), false);
  assert.equal(ui.bar.attributes["aria-hidden"], "true");

  selection.current = { name: "Frasco sob consulta", volume: 50, quantity: 1, price: null, consultation: true };
  ui.controller.refresh();
  assert.equal(ui.summaryTarget.textContent, "50 ml · Preço sob consulta");
  assert.equal(ui.button.textContent, "Consultar");
  ui.button.click();
  assert.equal(ui.sourceButton.clickCount, 2);

  browser.mobile = false;
  ui.controller.refresh();
  assert.equal(ui.bar.classList.contains("is-visible"), false);
  ui.controller.destroy();
  assert.equal(browser.observer.disconnected, true);
});

test("purchase bar falls back to scroll and resize events without IntersectionObserver", () => {
  const browser = createWindow({ observer: false });
  const selection = {
    current: { name: "Exemplo", volume: 10, quantity: 1, price: 30, consultation: false },
  };
  const ui = initialize(browser.value, selection);

  assert.equal(ui.bar.classList.contains("is-visible"), true);
  ui.sourceButton.rect = { top: 600, bottom: 648 };
  browser.value.dispatch("scroll");
  assert.equal(ui.bar.classList.contains("is-visible"), false);

  ui.sourceButton.rect = { top: 1000, bottom: 1048 };
  browser.value.dispatch("resize");
  assert.equal(ui.bar.classList.contains("is-visible"), true);

  ui.controller.destroy();
  assert.equal((browser.listeners.get("scroll") || []).length, 0);
  assert.equal((browser.listeners.get("resize") || []).length, 0);
});

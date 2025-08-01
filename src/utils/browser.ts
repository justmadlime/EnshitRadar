import browser from 'webextension-polyfill';

export { browser };

export type Tab = browser.Tabs.Tab;
export type MessageSender = browser.Runtime.MessageSender;
export type ExtensionMessage = {
  type: string;
  payload?: any;
};

export const getBrowser = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    return 'chrome';
  } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.id) {
    return 'firefox';
  }
  return 'unknown';
};

export const isChrome = () => getBrowser() === 'chrome';
export const isFirefox = () => getBrowser() === 'firefox'; 
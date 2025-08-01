// Popup script for the Chrome extension
import { MessageType } from '@/types';
import { sendToBackground, getCurrentTab } from '@/utils/messaging';
import { useSettingsStore } from '@/stores/settingsStore';
import { browser } from '@/utils/browser';
import { channelDatabase } from '@/utils/channelDatabase';

console.log('[EnshitRadar] 🎯 Popup script loaded');

// DOM elements
const toggleButton = document.getElementById('toggle-button') as HTMLButtonElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;

// Footer links  
const optionsLink = document.getElementById('options-link') as HTMLAnchorElement;
const helpLink = document.getElementById('help-link') as HTMLAnchorElement;
const discordLink = document.getElementById('discord-link') as HTMLAnchorElement;
const youtubeLink = document.getElementById('youtube-link') as HTMLAnchorElement;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[EnshitRadar] Popup DOM loaded, initializing...');
  
  try {
    // Load initial settings
    await useSettingsStore.getState().loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial UI update
    updateUI();
    
    console.log('[EnshitRadar] ✅ Popup initialized successfully');
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed to initialize popup:', error);
    showError('Failed to initialize extension popup');
  }
});

// Set up event listeners
function setupEventListeners() {
  // Toggle extension button
  toggleButton?.addEventListener('click', handleToggle);
  
  // Footer links
  optionsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
    window.close();
  });
  
  helpLink?.addEventListener('click', (e) => {
    e.preventDefault();
    browser.tabs.create({ url: 'https://github.com/justmadlime/EnshitRadar#readme' });
    window.close();
  });
  
  discordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    browser.tabs.create({ url: 'https://discord.gg/brCNpJcx' });
    window.close();
  });
  
  youtubeLink?.addEventListener('click', (e) => {
    e.preventDefault();
    browser.tabs.create({ url: 'https://www.youtube.com/@justmadlime' });
    window.close();
  });

  
  // Subscribe to store changes
  useSettingsStore.subscribe(updateUI);
}

async function handleToggle() {
  try {
    const currentSettings = useSettingsStore.getState().settings;
    const newEnabled = !currentSettings.enabled;
    
    // If disabling, cleanup session data first
    if (!newEnabled) {
      console.log('[EnshitRadar] 🧹 Extension being disabled - cleaning up session data');
      await cleanupSessionDataAllTabs();
    }
    
    // Update settings
    await useSettingsStore.getState().updateSettings({ enabled: newEnabled });
    
    // Notify background script
    await sendToBackground(MessageType.TOGGLE_FEATURE, { enabled: newEnabled });
    
    // Get current tab and notify content script
    const tab = await getCurrentTab();
    if (tab.id) {
      await browser.tabs.sendMessage(tab.id, {
        type: MessageType.TOGGLE_FEATURE,
        payload: { enabled: newEnabled }
      });
    }
    
    console.log('[EnshitRadar] Extension toggled:', newEnabled);
  } catch (error) {
    console.error('[EnshitRadar] Failed to toggle extension:', error);
    showError('Failed to toggle extension');
  }
}

async function cleanupSessionDataAllTabs() {
  try {
    const tabs = await browser.tabs.query({});
    
    const cleanupPromises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: MessageType.CLEANUP_SESSION_DATA,
            payload: { reason: 'extension_disabled' }
          });
        } catch (error) {
          // Tab might not have content script loaded
          console.debug('[EnshitRadar] Could not send cleanup to tab:', tab.id);
        }
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    console.log('[EnshitRadar] ✅ Session cleanup completed for all tabs');
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed to cleanup session data:', error);
  }
}



function updateUI() {
  const settings = useSettingsStore.getState().settings;
  const loading = useSettingsStore.getState().isLoading;
  
  // Update loading state
  document.body.classList.toggle('loading', loading);
  
  // Update status indicator
  const statusIndicator = document.getElementById('status-indicator') as HTMLElement;
  const statusDot = document.getElementById('status-dot') as HTMLElement;
  const statusText = document.getElementById('status-text') as HTMLElement;
  
  if (settings.enabled) {
    statusIndicator.className = 'status-indicator status-enabled';
    statusDot.className = 'status-dot dot-enabled';
    statusText.textContent = 'Extension is active';
  } else {
    statusIndicator.className = 'status-indicator status-disabled';
    statusDot.className = 'status-dot dot-disabled';
    statusText.textContent = 'Extension is disabled';
  }
  
  // Update toggle button
  const toggleText = document.getElementById('toggle-text') as HTMLElement;
  
  if (settings.enabled) {
    toggleButton.className = 'toggle-button toggle-enabled';
    toggleText.textContent = 'Disable Extension';
  } else {
    toggleButton.className = 'toggle-button toggle-disabled';
    toggleText.textContent = 'Enable Extension';
  }
  
  // Update database stats
  updateDatabaseStats();
}

function updateDatabaseStats() {
  try {
    const stats = channelDatabase.getStatistics();
    const totalChannels = channelDatabase.getTotalChannels();
    
    // Update total channels
    const totalElement = document.getElementById('total-channels') as HTMLElement;
    totalElement.textContent = totalChannels.toString();
    
    // Update individual counts
    const lowElement = document.getElementById('low-count') as HTMLElement;
    const middleElement = document.getElementById('middle-count') as HTMLElement;
    const highElement = document.getElementById('high-count') as HTMLElement;
    const confirmedElement = document.getElementById('confirmed-count') as HTMLElement;
    
    lowElement.textContent = stats.low.toString();
    middleElement.textContent = stats.middle.toString();
    highElement.textContent = stats.high.toString();
    confirmedElement.textContent = stats.confirmed.toString();
    
    // Show stats section
    const statsSection = document.getElementById('database-stats') as HTMLElement;
    statsSection.style.display = 'block';
    
  } catch (error) {
    console.error('[EnshitRadar] Failed to update database stats:', error);
  }
}

function showError(message: string) {
  statusText.textContent = message;
  statusText.style.color = '#dc3545';
  
  setTimeout(() => {
    updateUI();
  }, 3000);
} 
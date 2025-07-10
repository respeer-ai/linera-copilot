<template>
  <q-tabs v-model="selectedTab" inline-label>
    <q-tab name="craft" label="Craft" />
    <q-tab name="chat" label="Chat" />
    <q-tab name="code-review" label="Code Review" />
    <q-tab name="unit-test" label="Unit Test" />
    <q-tab name="module-test" label="Module Test" />
    <q-tab name="settings" label="Settings" />
  </q-tabs>

  <q-tab-panels v-model="selectedTab">
    <q-tab-panel name="craft">
      <CraftPanel />
    </q-tab-panel>

    <q-tab-panel name="chat">
      <div>Chat Panel Content</div>
    </q-tab-panel>

    <q-tab-panel name="code-review">
      <div>Code Review Panel Content</div>
    </q-tab-panel>

    <q-tab-panel name="unit-test">
      <div>Unit Test Panel Content</div>
    </q-tab-panel>

    <q-tab-panel name="module-test">
      <div>Module Test Panel Content</div>
    </q-tab-panel>

    <q-tab-panel name="settings">
      <div>Settings Panel Content</div>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { QTabs, QTab, QTabPanels, QTabPanel } from 'quasar';

import CraftPanel from './CraftPanel.vue';

const settingsStore = useSettingsStore();
const selectedTab = computed(() => settingsStore.selectedTab);
</script>

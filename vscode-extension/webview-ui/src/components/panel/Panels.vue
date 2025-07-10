<template>
  <q-tab-panels :dark='true' v-model="selectedTab">
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
import { QTabPanels, QTabPanel } from 'quasar';

import CraftPanel from './CraftPanel.vue';

const settingsStore = useSettingsStore();
const selectedTab = computed(() => settingsStore.selectedTab);
</script>

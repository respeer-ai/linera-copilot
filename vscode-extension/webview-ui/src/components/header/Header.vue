<template>
  <q-header elevated class="bg-transparent text-white">
    <q-toolbar>
      <div class="q-gutter-sm row items-center">
        <q-tabs v-model="selectedTab" inline-label dense narrow-indicator align="left">
          <q-tab name="craft" label="Craft" style="margin-right: 16px;" />
          <q-tab name="chat" label="Chat" style="margin-right: 16px;" />
          <q-tab name="code-review" label="Code Review" style="margin-right: 16px;" />
          <q-tab name="unit-test" label="Unit Test" style="margin-right: 16px;" />
          <q-tab name="module-test" label="Module Test" style="margin-right: 16px;" />
          <q-tab name="settings" label="Settings" style="margin-right: 16px;" />
        </q-tabs>

        <q-select
          v-model="sdkVersion"
          :options="sdkVersions"
          dense
          options-dense
          style="min-width: 100px"
          @update:model-value="persistSdkVersion"
        />

        <q-btn dense flat icon="add" />
        <q-btn dense flat icon="add_circle" />
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useSettingsStore } from '../../stores/settings'

const settingsStore = useSettingsStore()

const selectedTab = ref('chat')
const sdkVersion = ref(localStorage.getItem('sdkVersion') || 'v1.0.0')
const sdkVersions = ['v1.0.0', 'v1.1.0', 'v2.0.0']

// Persist SDK version to localStorage
const persistSdkVersion = (version: string) => {
  localStorage.setItem('sdkVersion', version)
}

// Initialize active tab from pinia
watchEffect(() => {
  selectedTab.value = settingsStore.selectedTab
})

// Update pinia when tab changes
watchEffect(() => {
  settingsStore.setSelectedTab(selectedTab.value)
})

</script>
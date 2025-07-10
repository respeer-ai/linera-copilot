<template>
    <div class="q-gutter-sm row items-center full-width text-white bg-transparent">
      <q-tabs v-model="selectedTab" inline-label dense narrow-indicator>
        <q-tab name="craft" label="Craft" no-caps style="margin-right: 16px;" />
        <q-tab name="chat" label="Chat" no-caps style="margin-right: 16px;" />
        <q-tab name="code-review" label="Code Review" no-caps style="margin-right: 16px;" />
        <q-tab name="unit-test" label="Unit Test" no-caps style="margin-right: 16px;" />
        <q-tab name="module-test" label="Module Test" no-caps style="margin-right: 16px;" />
        <q-tab name="settings" label="Settings" no-caps style="margin-right: 16px;" />
      </q-tabs>

      <q-space />

      <q-select
        v-model="sdkVersion"
        :options="sdkVersions"
        dense
        options-dense
        style="min-width: 100px"
        @update:model-value="persistSdkVersion"
        label='SDK Version'
        dark
      />

      <q-btn dense flat icon="add" />
      <q-btn dense flat icon="add_circle" />
    </div>
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

<style scoped>
.q-tab {
  padding: 0 !important;
  min-height: 24px !important;
  font-size: 14px;
}

.q-tab__label {
  font-size: 10px;
}

.q-toolbar {
  min-height: 24px !important;
}
</style>
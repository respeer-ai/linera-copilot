<template>
  <q-card class="bg-transparent" dense>
    <q-card-section>
      <q-input
        v-model="modelUrl"
        label="Model URL"
        outlined
        dense
        class="q-mb-sm"
        dark
      />
      <q-input
        v-model="apiToken"
        label="API Token"
        outlined
        dense
        type="password"
        class="q-mb-sm"
        dark
      />
      <q-input
        v-model="modelName"
        label="Model Name"
        outlined
        dense
        class="q-mb-sm"
        dark
      />
      <q-input
        v-model="projectRoot"
        label="Project Root"
        outlined
        dense
        class="q-mb-sm"
        dark
      />
    </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Save" color="white" @click="saveSettings" />
      </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { NotifyManager } from '../../notify';
import { PluginSettings } from '../../settings';

const $q = useQuasar();
const modelUrl = ref('');
const apiToken = ref('');
const modelName = ref('');
const projectRoot = ref('');

const loadSettings = () => {
  const settings = PluginSettings.getAllSettings();
  if (settings) {
    modelUrl.value = settings.modelUrl || '';
    apiToken.value = settings.apiToken || '';
    modelName.value = settings.modelName || '';
    projectRoot.value = settings.projectRoot || '';
  }
};

const saveSettings = () => {
  let settings = PluginSettings.getAllSettings()
  settings = {
    ...settings,
    modelUrl: modelUrl.value,
    apiToken: apiToken.value,
    modelName: modelName.value,
    projectRoot: projectRoot.value
  };
  PluginSettings.saveAllSettings(settings);
  NotifyManager.showSuccess($q, 'Settings saved successfully');
};

onMounted(() => {
  loadSettings();
});
</script>

import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    selectedTab: 'craft' // 默认选中的tab
  }),
  actions: {
    setSelectedTab(tab: string) {
      this.selectedTab = tab;
    }
  },
  getters: {
    getSelectedTab: (state) => state.selectedTab
  }
});

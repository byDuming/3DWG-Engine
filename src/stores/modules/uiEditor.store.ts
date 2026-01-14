import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'

export const useUiEditorStore = defineStore('uiEditor', () => {
  const tabKey = ref<string | null>(null)

  function setTabKey(key: string | null) {
    tabKey.value = key
  }

  function resetTabForSelection() {
    nextTick(() => {
      tabKey.value = 'attributes-tab';
    })
  }

  return {
    tabKey,
    setTabKey,
    resetTabForSelection
  }
})
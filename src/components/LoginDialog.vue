<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/modules/useAuth.store'
import { useMessage } from 'naive-ui'

const authStore = useAuthStore()
const message = useMessage()

// 表单数据
const formData = ref({
  email: '',
  password: ''
})

// 是否正在提交
const submitting = ref(false)

// 监听对话框打开，重置表单
watch(() => authStore.showLoginDialog, (show) => {
  if (show) {
    formData.value = { email: '', password: '' }
    authStore.clearError()
  }
})

// 处理登录
async function handleLogin() {
  if (!formData.value.email || !formData.value.password) {
    message.warning('请输入邮箱和密码')
    return
  }
  
  submitting.value = true
  
  try {
    const success = await authStore.login(formData.value.email, formData.value.password)
    if (success) {
      message.success('登录成功')
    }
  } finally {
    submitting.value = false
  }
}

// 处理取消
function handleCancel() {
  authStore.closeLoginDialog()
}

// 处理按下回车
function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <n-modal
    v-model:show="authStore.showLoginDialog"
    preset="card"
    title="登录"
    style="width: 400px;"
    :mask-closable="true"
    :closable="true"
    @close="handleCancel"
  >
    <n-form @keypress="handleKeyPress">
      <n-form-item label="邮箱">
        <n-input
          v-model:value="formData.email"
          placeholder="请输入邮箱"
          :disabled="submitting"
        />
      </n-form-item>
      
      <n-form-item label="密码">
        <n-input
          v-model:value="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password-on="click"
          :disabled="submitting"
        />
      </n-form-item>
      
      <n-alert
        v-if="authStore.error"
        type="error"
        :show-icon="true"
        style="margin-bottom: 16px;"
      >
        {{ authStore.error }}
      </n-alert>
      
      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="submitting">
          取消
        </n-button>
        <n-button
          type="primary"
          @click="handleLogin"
          :loading="submitting"
        >
          登录
        </n-button>
      </n-space>
    </n-form>
    
    <template #footer>
      <n-text depth="3" style="font-size: 12px;">
        提示：需要管理员账户才能创建、编辑或删除场景
      </n-text>
    </template>
  </n-modal>
</template>

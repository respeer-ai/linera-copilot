import { useQuasar } from 'quasar'

// 创建通知服务实例
const useNotification = () => {
  const $q = useQuasar()

  /**
   * 显示成功通知
   * @param message 通知消息内容
   */
  const showSuccess = (message: string) => {
    $q.notify({
      type: 'positive',
      message,
      position: 'bottom-right'
    })
  }

  /**
   * 显示错误通知
   * @param message 通知消息内容
   */
  const showError = (message: string) => {
    $q.notify({
      type: 'negative',
      message,
      position: 'bottom-right'
    })
  }

  /**
   * 显示信息通知
   * @param message 通知消息内容
   */
  const showInfo = (message: string) => {
    $q.notify({
      type: 'info',
      message,
      position: 'bottom-right'
    })
  }

  return {
    showSuccess,
    showError,
    showInfo
  }
}

export default useNotification

export class NotifyManager {
  /**
  * 显示成功通知
  * @param $q Quasar实例
  * @param message 通知消息内容
  */
  public static showSuccess($q: any, message: string) {
    $q.notify({
      type: 'positive',
      message,
      position: 'bottom-right'
    });
  }

  /**
  * 显示错误通知
  * @param $q Quasar实例
  * @param message 通知消息内容
  */
  public static showError($q: any, message: string) {
    $q.notify({
      type: 'negative',
      message,
      position: 'bottom-right'
    });
  }

  /**
  * 显示信息通知
  * @param $q Quasar实例
  * @param message 通知消息内容
  */
  public static showInfo($q: any, message: string) {
    $q.notify({
      type: 'info',
      message,
      position: 'bottom-right'
    });
  }
}
 
 // 导出统一的notify对象创建函数（已移除，因为现在使用静态方法）
 // export const createNotify = ($q: any) => new NotifyManager($q);
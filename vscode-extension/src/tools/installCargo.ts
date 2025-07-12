import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * 安装 Rust（即安装 rustup 和 cargo）
 */
export async function installCargo(): Promise<{ success: boolean; message?: string }> {
  const platform = os.platform();

  try {
    console.log('[Tool] Installing Cargo...');

    if (platform === 'win32') {
      // Windows 平台使用 PowerShell
      const command = `powershell -Command "iwr https://win.rustup.rs -UseBasicParsing | iex"`;
      await execAsync(command);
    } else {
      // macOS / Linux 平台使用 curl + sh
      const command = `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`;
      await execAsync(command);
    }

    console.log('[Tool] Cargo installed successfully.');
    return { success: true };
  } catch (error: any) {
    console.error('[Tool] Failed to install Cargo:', error.message);
    return { success: false, message: error.message };
  }
}

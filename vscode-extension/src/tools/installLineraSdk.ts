import * as os from "os";
import * as iconv from "iconv-lite";
import { executeInTerminal } from "./executeInTreminal";

/**
 * 安装 Linera SDK（即安装 rustup 和 cargo）
 */
export async function installLineraSdk(): Promise<{ success: boolean; message?: string }> {
  const platform = os.platform();

  try {
    console.log("[Tool] Installing Linera SDK...");

    let command: string;

    if (platform === "win32") {
      // Windows: 设置 UTF-8 编码，使用单引号包裹 PowerShell 命令避免转义问题
      command = `iwr https://win.rustup.rs -UseBasicParsing | iex`;
    } else {
      // Unix 系统
      command = `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`;
    }

    console.log(`[Tool] Running command: ${command}`);

    const rc = await executeInTerminal(command)

    console.log("[Tool] Linera SDK installed successfully:\n", rc.logs);
    return rc;
  } catch ({ error, stderr }: any) {
    let message: string;

    if (os.platform() === "win32") {
      // Windows 上可能是 GBK 编码，尝试用 iconv 解码
      try {
        message = iconv.decode(stderr, "gbk");
      } catch {
        message = stderr.toString("utf8");
      }
    } else {
      message = stderr.toString("utf8");
    }

    console.error("[Tool] Failed to install Linera SDK:", message);
    throw new Error(message);
  }
}

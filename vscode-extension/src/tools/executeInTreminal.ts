import * as vscode from 'vscode';
import { spawn } from 'child_process';

interface ExecuteInTerminalResult {
  success: boolean;
  logs?: string;
}

/**
 * 在 VSCode 终端中执行一行命令字符串，支持交互和日志收集
 * @param fullCommand 一整行 shell 命令
 * @returns 执行结果（是否成功，可选日志）
 */
export function executeInTerminal(
  fullCommand: string
): Promise<ExecuteInTerminalResult> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const writeEmitter = new vscode.EventEmitter<string>();
    const closeEmitter = new vscode.EventEmitter<void>();

    let proc: ReturnType<typeof spawn> | undefined;
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    const pty: vscode.Pseudoterminal = {
      onDidWrite: writeEmitter.event,
      onDidClose: closeEmitter.event,

      open: () => {
        writeEmitter.fire(`[PTY] Starting command: ${fullCommand}\r\n`);
        console.log(`[PTY] open() called`);

        // ✅ 修改 START
        let shell: string;
        let shellArgs: string[];

        if (process.platform === 'win32') {
          shell = 'powershell.exe';
          shellArgs = [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', fullCommand
          ];
        } else {
          shell = 'sh';
          shellArgs = ['-c', fullCommand];
        }
        // ✅ 修改 END

        try {
          proc = spawn(shell, shellArgs, {
            cwd,
            shell: false,
          });
          console.log(`[PTY] Spawned process with PID: ${proc.pid}`);
        } catch (err: any) {
          const msg = `[PTY] Failed to spawn process: ${err.message}`;
          console.error(msg);
          writeEmitter.fire(`${msg}\r\n`);
          closeEmitter.fire();
          resolve({
            success: false,
            logs: logs.concat(msg).join(''),
          });
          return;
        }

        proc.stdout?.on('data', (data) => {
          const text = data.toString();
          logs.push(text);
          writeEmitter.fire(text);
        });

        proc.stderr?.on('data', (data) => {
          const text = data.toString();
          logs.push(text);
          writeEmitter.fire(text);
        });

        proc.on('close', (code) => {
          const exitMsg = `[PTY] Process exited with code ${code}`;
          console.log(exitMsg);
          writeEmitter.fire(`\r\n${exitMsg}\r\n`);
          closeEmitter.fire();
          resolve({
            success: code === 0,
            logs: logs.join(''),
          });
        });

        proc.on('error', (err) => {
          const msg = `[PTY] Process error: ${err.message}`;
          console.error(msg);
          writeEmitter.fire(`\r\n${msg}\r\n`);
          closeEmitter.fire();
          resolve({
            success: false,
            logs: logs.concat(msg).join(''),
          });
        });
      },

      handleInput: (data: string) => {
        if (proc && proc.stdin?.writable) {
          proc.stdin.write(data);
        }
      },

      close: () => {
        if (proc && !proc.killed) {
          console.log('[PTY] Manually killing process');
          proc.kill();
        }
      },
    };

    console.log(`[PTY] Creating VSCode terminal for command: ${fullCommand}`);
    const terminal = vscode.window.createTerminal({
      name: `Run: ${fullCommand}`,
      pty,
    });

    terminal.show(true);
    console.log('[PTY] Terminal shown');
  });
}


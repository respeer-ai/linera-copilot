<template>
  <div class="flex justify-center align-center flex-column full-height">
    <div :style='{height: bodyHeight}' v-if='!chatting' class='flex flex-center justify-center align-center full-width'>
      <div class='full-width'>
        <div class="text-h6 text-center" style="margin-top: 48px;">
          Create Reactive & Realtime dApps with Linera Microchain
        </div>

        <div class="row justify-center q-mt-md flex-1">
          <div class="full-width" v-for="(card, index) in cards" :key="index" @click="onActionCardClick(card)">
            <q-card flat class="q-pa-md cursor-pointer full-width bg-transparent row q-mt-sm items-center">
              <q-icon :name="card.icon" size="1.2rem" class="q-mr-md" />
              <div class="text-normal text-weight-medium q-mr-sm">{{ card.title }}</div>
              <div class="text-caption text-grey">{{ card.subtitle }}</div>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div v-else :style='{height: bodyHeight}' class='full-width'>
      <MessageList :messages="messages" :height="bodyHeight" />
    </div>

    <div class="q-my-sm q-mx-md fixed-bottom q-pa-sm">
      <MessageInput @send="onSendMessage" />
      <q-resize-observer @resize="onMessageInputResize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Message } from '../message/Message';
import { requestLLMResponse, streamLLMResponse, type LLMResponse, type ToolCall } from '../../llm';
import { exampleTask, projectTasksToHtml, type CraftTask, type SubTask } from '../craft/CraftTask';
import { createLoadingHtml } from '../../waiting';
import { PluginSettings } from '../../settings';
import { analyzeUserIntent, type UserIntent } from '../../intent';
import { ProjectTaskManager } from '../craft/Craft';

import MessageInput from '../input/MessageInput.vue';
import MessageList from '../message/MessageList.vue';
import { BackendCli } from '../../backend';
import { generateToolCallRunningHtml } from '../../tools';
import { generateErrorHtml } from '../../error';

const cards = ref([
  {
    icon: 'gamepad',
    title: 'Create a 2048 game',
    subtitle: 'Build a classic 2048 game with Linera'
  },
  {
    icon: 'calculate',
    title: 'Create a counter program',
    subtitle: 'Develop a simple counter application'
  },
  {
    icon: 'info',
    title: 'Explain project',
    subtitle: 'Get detailed explanations of your project'
  },
  {
    icon: 'play_arrow',
    title: 'Execute project',
    subtitle: 'Run and test your dApp in real-time'
  }
]);

const bodyHeight = ref('0px')
const chatting = ref(false)
const messages = ref([] as Message[])
const tasks = ref([] as CraftTask[])
const messageMode = ref('Replace');
const projectTaskManager = ref(undefined as ProjectTaskManager | undefined);

const onMessageInputResize = (size: { height: number; }) => {
  bodyHeight.value = `${window.innerHeight - size.height - 48}px`
}

const onStreamLLMResponse = async (responseGenerator: AsyncGenerator<LLMResponse, void, unknown>, needTaskJson: boolean) => {
  for await (const response of responseGenerator) {
    if (response.isComplete) {
      messageMode.value = 'New';
      if (response.type === 'text') {
        const index = messages.value.length - 1
          const message = {
            ...messages.value[index],
            content: messages.value[index].content + response.text
          }
          messages.value.splice(index, 1, message);
      } else if (response.type === 'error') {
          messages.value.push({
            sender: 'llm',
            content: generateErrorHtml(response.taskPrompt, response.text)
          })
        }
      if (needTaskJson) {
        await taskJsonRequest(messages.value[messages.value.length - 1].content)
      }
    } else {
      if (messageMode.value === 'New') {
        messageMode.value = 'Append'
        if (response.type === 'text') {
          messages.value.push({
            sender: 'llm',
            content: response.text
          })
        }
      } else if (messageMode.value === 'Replace') {
        if (response.type === 'text') {
          messages.value[messages.value.length - 1].content = response.text
        }
        messageMode.value = 'Append';
      } else {
        if (response.type === 'text') {
          const index = messages.value.length - 1
          const message = {
            ...messages.value[index],
            content: messages.value[index].content + response.text
          }
          messages.value.splice(index, 1, message);
        }
      }
    }
  }
}

const executeIntent = async (intent: UserIntent) => {
  try {
    const personality = 'You are a programming assistant managing a project with defined tasks.'
    const responseGenerator = streamLLMResponse(personality, intent.intentDescription);
    await onStreamLLMResponse(responseGenerator, false)
  } catch (error) {
    messages.value[messages.value.length - 1].content = `${error}`
  }
}

const executeToolCall = async (toolCall: ToolCall) => {
  console.log('WebView Executing tool call:', toolCall);
  messages.value.push({
    sender: 'llm',
    content: generateToolCallRunningHtml(toolCall)
  })
  messageMode.value = 'Replace';

  BackendCli.executeToolCall(toolCall)
}

const executeToolCalls = async (task: SubTask) => {
  for (const toolCall of task.toolCalls || []) {
    try {
      executeToolCall(toolCall)
    } catch (error) {
      messages.value[messages.value.length - 1].content = `${error}`
    }
  }
}

const executeNextTask = async () => {
  const task = projectTaskManager.value?.getNextTaskInfo()
  if (!task) {
    messages.value[messages.value.length - 1].content = 'No more tasks available.'
    return;
  }

  try {
    const responseGenerator = projectTaskManager.value?.executeNext();
    if (!responseGenerator) {
      messages.value[messages.value.length - 1].content = 'No response generator available for the next task.';
      return;
    }
    await onStreamLLMResponse(responseGenerator, false)
  } catch (error) {
    messages.value[messages.value.length - 1].content = `${error}`
  }

  if (task.toolCalls?.length) {
    executeToolCalls(task)
  }
}

const onSendMessage = async (message: string) => {
  messages.value.push({
    sender: 'user',
    content: message
  })

  messages.value.push({
    sender: 'llm',
    content: createLoadingHtml('I\'m thinking...')
  })
  messageMode.value = 'Replace';

  const intent = await analyzeUserIntent(message, JSON.stringify(tasks.value))
  if (!intent.isContextRelevant && tasks.value.length > 0) {
    messages.value[messages.value.length - 1].content = intent.intentDescription
    return
  }

  if (tasks.value.length === 0) {
    await splitTaskRequest(message)
    return
  }
  if (intent.requestNextTask) {
    await executeNextTask()
    return
  }

  await executeIntent(intent)
}

const taskJsonRequest = async (message: string) => {
  messages.value.push({
    sender: 'llm',
    content: createLoadingHtml('Preparing project task list...')
  })
  messageMode.value = 'Replace';

  message = `Based on the task below, return a clear, structured JSON list of development steps for a programming copilot.
             【Task Description】
             ${message}
             【Important Notes】
             - DO NOT include any text outside the JSON.
             - The JSON must strictly follow the structure above.
             - Only list essential files needed in each step.
             - Avoid lengthy explanations—just a clear, concise JSON response.
             【Reminder】
             Be sure to always return the **full relative path** for files. Do not skip folders.
             【Output Instructions】
             Always provide the **full relative file path**, including subfolders.
             - ✅ Correct: "contracts/src/game.rs"
             - ❌ Incorrect: "game.rs"`

  const personality = 'You are an assistant for Linera blockchain development.'
  let tasksJson = ''

  try {
    tasksJson = await requestLLMResponse(personality, message, { jsonFormat: true, isList: true }, exampleTask)
  } catch (error) {
    messages.value[messages.value.length - 1].content = generateErrorHtml('Preparing project task list', `Failed generate project tasks: ${error}`)
  }
  messageMode.value = 'Replace';

  try {
    tasks.value = JSON.parse(tasksJson)
  } catch (error) {
    console.log(tasksJson)
    messages.value[messages.value.length - 1].content = generateErrorHtml('Preparing project task list', `Failed parse task json: ${error}`)
    messageMode.value = 'New';
    return
  }

  try {
    messages.value[messages.value.length - 1].content = projectTasksToHtml(tasks.value)
  } catch (error) {
    console.log(tasks.value)
    messages.value[messages.value.length - 1].content = generateErrorHtml('Preparing project task list', `Failed generate task html: ${error}`)
    messageMode.value = 'New';
    return
  }

  projectTaskManager.value = new ProjectTaskManager(tasks.value[0]);
}

const splitTaskRequest = async (prompt: string) => {
  messages.value.push({
    sender: 'llm',
    content: createLoadingHtml('I\'m thinking...')
  })
  messageMode.value = 'Replace';

  try {
    const personality = 'You are an experienced top-tier engineer and architect who excels at breaking down tasks into manageable components.'
    const responseGenerator = streamLLMResponse(personality, prompt);
    await onStreamLLMResponse(responseGenerator, true)
  } catch (error) {
    messages.value[messages.value.length - 1].content = `${error}`
  }
}

const onActionCardClick = async (card: { title: any; subtitle: any; }) => {
  chatting.value = true
  const prompt = `Break down the task "${card.title}" into clear steps for programming copilot to follow.
                  Task: ${card.title}\nSubtitle: ${card.subtitle}. It will be built on Linera blockchain with SDK version ${PluginSettings.getSdkVersion()}`;
  messages.value.push({
    sender: 'user',
    content: prompt
  });
  await splitTaskRequest(prompt)
}

</script>

<style scoped>
.q-card {
  border: 1px solid #555;
  border-radius: 8px;
  transition: transform 0.2s;
}

.q-card:hover {
  border: 1px solid #ccc;
}
</style>
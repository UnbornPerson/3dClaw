import { useState, useRef, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import type { AgentState } from "@/lib/openclaw/types";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  agentName?: string;
  text: string;
  timestamp: string;
}

const AGENT_RESPONSES = [
  "收到！我正在处理这个任务。",
  "没问题，我马上开始。",
  "这个需求我已经在进行中了，大概还需要30分钟。",
  "好的，我来看一下这个 PR。",
  "代码审查已完成，LGTM！🚀",
  "我刚刚提交了一个修复，请查看。",
  "这个 bug 我已经定位到了，正在修复。",
  "今天的 standup 已经记录好了。",
  "Sprint 进度正常，目前完成了 78%。",
  "我正在优化这个模块的性能。",
  "测试用例全部通过 ✅",
  "文档已经更新完毕。",
];

function getTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function ChatPanel({
  open,
  onClose,
  agents,
  selectedAgentId,
}: {
  open: boolean;
  onClose: () => void;
  agents: AgentState[];
  selectedAgentId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: input.trim(),
      timestamp: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate agent response
    setTimeout(() => {
      const response = AGENT_RESPONSES[Math.floor(Math.random() * AGENT_RESPONSES.length)];
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "agent",
        agentName: selectedAgent?.name ?? "Agent",
        text: response,
        timestamp: getTime(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 800 + Math.random() * 1200);
  };

  if (!open) return null;

  return (
    <div className={styles.chatDrawer}>
      <div className={styles.chatHeader}>
        <div>
          <span className={styles.chatHeaderDot} style={{ background: "#35b57d" }} />
          <strong>与 {selectedAgent?.name ?? "Agent"} 对话</strong>
        </div>
        <button className={styles.drawerClose} onClick={onClose} type="button">×</button>
      </div>
      <div className={styles.chatMessages} ref={scrollRef}>
        {messages.length === 0 ? (
          <div className={styles.chatEmpty}>
            <p>👋 向 <strong>{selectedAgent?.name}</strong> 发送消息</p>
            <p>你可以分配任务、询问进度或查看工作状态</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.chatBubble} ${msg.sender === "user" ? styles.chatBubbleUser : styles.chatBubbleAgent}`}
            >
              {msg.sender === "agent" && (
                <span className={styles.chatBubbleName}>{msg.agentName}</span>
              )}
              <p>{msg.text}</p>
              <span className={styles.chatBubbleTime}>{msg.timestamp}</span>
            </div>
          ))
        )}
      </div>
      <div className={styles.chatInputBar}>
        <input
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`对 ${selectedAgent?.name ?? "Agent"} 说点什么...`}
        />
        <button className={styles.chatSendBtn} onClick={sendMessage} type="button">
          发送
        </button>
      </div>
    </div>
  );
}

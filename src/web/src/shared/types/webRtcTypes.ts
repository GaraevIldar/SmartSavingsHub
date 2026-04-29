import * as React from "react";

export interface UseWebRTCConfig {
    signalingServerUrl: string;
    iceServers: readonly RTCIceServer[];
}

export interface ChatMessage {
    id: string;
    text: string;
    username: string;
    timestamp: number;
    isOwn: boolean;
}

export type ConnectionStatus = 'idle' | 'connected' | 'disconnected' | 'failed'
export type MicStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export interface RoomParticipant {
    socketId: string;
    username: string;
}

export interface UseWebRTCReturn {
    messages: ChatMessage[];
    connectionStatus: ConnectionStatus;
    joinRoom: (roomId: string, username: string) => Promise<void>;
    sendMessage: (text: string) => void;
    participants: RoomParticipant[];
    localSocketId: string | null;
    localUsername: string;
    needsPlayConfirm: boolean;
    confirmPlay: () => Promise<void>;
    micStatus: MicStatus;
    isMuted: boolean;
    toggleMic: () => void;
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    startVoice: () => void;
    stopVoice: () => void;
}

export interface DataChannelMessage {
    id: string;
    text: string;
    username: string;
    timestamp: number;
}
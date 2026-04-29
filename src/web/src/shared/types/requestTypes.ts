export interface Guild {
    id: string
    name: string
    description?: string
    icon?: string
    ownerId: string
    createdAt: Date
    updatedAt: Date
    memberCount: number
}

export interface Channel {
    id: string
    guildId: string
    name: string
    type: 'text' | 'voice' | 'announcement'
    position: number
    createdAt: Date
}

export interface Member {
    id: string
    guildId: string
    userId: string
    username: string      // для @упоминаний, уникальный
    displayName: string    // отображаемое имя
    role: 'owner' | 'admin' | 'moderator' | 'member'
    joinedAt: Date
    avatar?: string
}

export interface Invite {
    code: string
    guildId: string
    channelId: string
    inviterId: string
    maxUses?: number
    uses: number
    expiresAt?: Date
    createdAt: Date
}

export interface CreateGuildRequest {
    name: string
    description?: string
    icon?: string
}

export interface CreateChannelRequest {
    name: string
    type: 'text' | 'voice' | 'announcement'
}

export interface CreateInviteRequest {
    channelId: string
    maxUses?: number
    expiresIn?: number // в секундах
}

export interface UpdateMemberRoleRequest {
    role: 'admin' | 'moderator' | 'member'
}
import {axiosInstance} from "../axiosInstance.ts";

export async function banMember(guildId: string, userId: string): Promise<void> {
    try {
        await axiosInstance.post(`/api/guilds/${guildId}/members/${userId}/ban`)
    } catch (error) {
        console.error('Ошибка бана участника:', error)
        throw error
    }
}
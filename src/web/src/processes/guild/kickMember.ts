import {axiosInstance} from "../axiosInstance.ts";

export async function kickMember(guildId: string, userId: string): Promise<void> {
    try {
        await axiosInstance.post(`/api/guilds/${guildId}/members/${userId}/kick`)
    } catch (error) {
        console.error('Ошибка кика участника:', error)
        throw error
    }
}
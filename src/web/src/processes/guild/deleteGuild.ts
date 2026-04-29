import {axiosInstance} from "../axiosInstance.ts";

export async function deleteGuild(guildId: string): Promise<void> {
    try {
        await axiosInstance.delete(`/api/guilds/${guildId}`)
    } catch (error) {
        console.error('Ошибка удаления сервера:', error)
        throw error
    }
}
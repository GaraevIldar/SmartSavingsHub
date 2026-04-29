import {axiosInstance} from "../axiosInstance.ts";
import {CreateGuildRequest, Guild} from "../../shared/types/requestTypes.ts";

export async function createGuild(data: CreateGuildRequest): Promise<Guild> {
    try {
        const response = await axiosInstance.post('/api/guilds', data)
        return response.data
    } catch (error) {
        console.error('Ошибка создания сервера:', error)
        throw error
    }
}
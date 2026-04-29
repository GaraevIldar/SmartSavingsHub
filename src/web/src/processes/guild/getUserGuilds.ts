import {axiosInstance} from "../axiosInstance.ts";
import {Guild} from "../../shared/types/requestTypes.ts";

export async function getUserGuilds(): Promise<Guild[]> {
    try {
        const response = await axiosInstance.get('/api/guilds')
        return response.data
    } catch (error) {
        console.error('Ошибка получения списка серверов:', error)
        throw error
    }
}
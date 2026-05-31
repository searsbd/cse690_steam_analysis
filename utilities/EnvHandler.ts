import 'dotenv/config';

/**
 * Helper class used to handle stuff in the enviroment file
 * like the steam API key
 */
export class EnvHandler {

    /**
     * Gets the steam API key from the env file
     * 
     * @returns The steam API key from the .env
     */
    public static getSteamApiKey(): string {
        return process.env.STEAM_API_KEY ?? "";
    }
}

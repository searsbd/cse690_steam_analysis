import { EnvHandler } from "../utilities/EnvHandler";
import { FileService } from "../utilities/FileService";

/**
 * Class that is used to build a list of all the steam games
 * and their corresponding app ids
 */
export class GameListCompiler {

    /**
     * The endpoint to make requests to to get the game list
     */
    private static readonly GET_APP_LIST_ENDPOINT: string = "https://api.steampowered.com/IStoreService/GetAppList/v1/";

    /**
     * Runs the full process to get the full game list
     */
    public static async getGameList(): Promise<void> {
        const STEAM_API_KEY: string = EnvHandler.getSteamApiKey();
        const appIDs: number[] = [];
        let haveMoreResults: boolean = true;
        let lastAppID: number | undefined = undefined;
        while (haveMoreResults) {
            let response = await this.makeRequestToEndpoint(STEAM_API_KEY, lastAppID)
            for (const app of response.response.apps) {
                appIDs.push(app.appid);
            }
            haveMoreResults = response.response.have_more_results;
            lastAppID = response.response.last_appid;
            console.log(`Currently retreived a total of ${appIDs.length} appids`)
        }
        FileService.writeFileJSON("./intermediary_files/ids.json", appIDs)
    }

    /**
     * Requests to the game list api
     * 
     * @param apiKey The api key to the steam api
     * @param lastAppID the last api that was checked, if it exists
     */
    private static async makeRequestToEndpoint(apiKey: string, lastAppID: number | undefined): Promise<any> {
        let requestURL: string = `${this.GET_APP_LIST_ENDPOINT}?key=${apiKey}&max_results=50000`;
        if (lastAppID) {
            requestURL = `${requestURL}&last_appid=${lastAppID}`
        }
        const response: Response = await fetch(requestURL);
        return await response.json();
    }

}

GameListCompiler.getGameList();
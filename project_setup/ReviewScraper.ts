import { FileService } from "../utilities/FileService";

/**
 * Helper class used to scrape the reviews for all games
 */
export class ReviewScraper {

    /**
     * The base endpoint that is requested to get the reviews for a game, does not include the
     * game itself or that it should be formatted as a json
     */
    private readonly REVIEW_BASE_ENDPOINT: string = "https://store.steampowered.com/appreviews/"

    /**
     * The amount of time to wait between requests. Increases based on the number of time
     * the program has been rate limited
     */
    private waitTimeBetweenRequestsMilliseconds: number = 1000;

    /**
     * For every game in the list of all apps, scrape their reviews
     */
    public async scrapeAllGames(): Promise<void> {
        const allAppIds: number[] = FileService.readFileJSON('./intermediary_files/ids.json');
        const startTimeMs: number = (new Date()).getTime();
        const startIndex: number = parseInt(FileService.readFileString('./intermediary_files/first-new-game.txt'));
        for (let i = startIndex; i < allAppIds.length; i++) {
            const appID: number = allAppIds[i];
            try {
                console.log(`Started scraping of reviews from game ${i + 1} of ${allAppIds.length}`);
                await this.scrapeGameReviewsByAppId(appID);
                const finishTimeMs: number = (new Date()).getTime();
                const timeSinceStartHours: number = (finishTimeMs - startTimeMs) / 3_600_000;
                const averageTimePerGame: number = timeSinceStartHours / (i - startIndex + 1);
                const timeRemainingHours: number = averageTimePerGame * (allAppIds.length - i - 1);
                console.log(`Finished scraping reviews for game ${i + 1} of ${allAppIds.length}`)
                console.log(`For the ${allAppIds.length - i - 1} remaining games, there is an estimated ${timeRemainingHours} hours remaining.`);
                const eta = new Date(Date.now() + timeRemainingHours * 3_600_000);
                console.log(`Estimated finished at ${eta.toLocaleString()}`);
            } catch {
                const fileName: string = `./intermediary_files/first-new-game.txt`;
                FileService.writeFileString(fileName, `${i}`)
                break;
            }
        }
        console.log("finished all games congrats");
    }

    /**
     * For a given game, scrapes all the review information
     * 
     * @param appID The appid of the game you want to write all the reviews to a file for
     */
    private async scrapeGameReviewsByAppId(appID: number): Promise<void> {
        const allReviews: any[] = [];
        let cursor: string = '*';
        const seenCursors: Set<string> = new Set<string>();
        let gameTotalReviewCount: number = -1;
        let writeCount: number = 0;
        let reviewsSeenCount: number = 0;

        while (true) {

            // write files as you go to keep array size small
            if (allReviews.length >= 5_000) {
                const fileName: string = `./reviews/${appID}part${writeCount + 1}.json.gz`;
                FileService.writeFileJSON(fileName, allReviews, true);
                allReviews.length = 0;
                writeCount++;
            }

            // make request
            let endpoint: string = `${this.REVIEW_BASE_ENDPOINT}${appID}?json=1&num_per_page=100&cursor=${cursor}&filter=recent`;
            const response: any = await this.requestWithExponentialRetry(endpoint);

            // if request fails, note that this game download failed
            if (!response) {
                const fileName: string = `./failed_downloads/${appID}.txt`;
                FileService.writeFileString(fileName, 'failed to complete download')
                return;
            }

            // get all the reviews from this specific request
            const reviewBatch: any[] = response.reviews ?? [];

            // if we have already seen this one, we are done
            if (seenCursors.has(response.cursor)) {
                break;
            }

            // store all the new reviews
            reviewsSeenCount += reviewBatch.length;
            allReviews.push(...reviewBatch);

            // encode the cursor for the request since it can have plusses and stuff
            cursor = encodeURIComponent(response.cursor);
            seenCursors.add(response.cursor);

            // initialize the total number of reviews for this game
            if (response.query_summary.total_reviews) {
                gameTotalReviewCount = response.query_summary.total_reviews;
            }

            console.log(`Progress for appid ${appID}: ${reviewsSeenCount} / ${gameTotalReviewCount}.`);
        }

        // final write for any leftover reviews
        if (allReviews.length > 0) {
            const fileName: string = `./reviews/${appID}part${writeCount + 1}.json.gz`;
            FileService.writeFileJSON(fileName, allReviews, true);
        }

        console.log(`Finished iterating through appid ${appID}.`)
    }

    /**
     * Makes a request to the given endpoint, but accounts for the steam api rate limit
     * 
     * @param fullEndpoint The full endpoint that you want to make a get request to.
     * @param timesRequested The number of times this specific game has been requested
     * @returns the contents of the get request made to the param url
     */
    private async requestWithExponentialRetry(fullEndpoint: string, timesRequested: number = 0): Promise<any> {
        const NUM_RETRIES: number = 6;
        if (timesRequested >= NUM_RETRIES) {
            return null;
        }

        if (this.waitTimeBetweenRequestsMilliseconds > 0) {
            await this.delay(this.waitTimeBetweenRequestsMilliseconds / 1000);
        }
        
        try {
            const response: Response = await fetch(fullEndpoint);
            if (response.status === 429) {
                this.waitTimeBetweenRequestsMilliseconds += 200;
                await this.delay(2 ** timesRequested)
                return await this.requestWithExponentialRetry(fullEndpoint, timesRequested + 1);
            }

            if (!response.ok) {
                return await this.requestWithExponentialRetry(fullEndpoint, timesRequested + 1);
            }

            return await response.json();
        } catch {
            return await this.requestWithExponentialRetry(fullEndpoint, timesRequested + 1);
        }
    }

    /**
     * Sleep method that takes in a time in seconds to resolve
     * 
     * @param seconds The number of seconds to delay for
     * @returns A promise that resolves in the amount of seconds passed
     */
    private async delay(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

}
const reviewScraper: ReviewScraper = new ReviewScraper();
reviewScraper.scrapeAllGames();
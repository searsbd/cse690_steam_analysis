import { Review } from "../types/Review";
import { FileService } from "../utilities/FileService";

/**
 * Helper class used to condense all the individual (hundreds of thousands) of
 * review files into a smaller amount of files.
 */
export class FileCondenser {

    private static readonly MIN_REVIEWS_PER_FILE: number = 25_000;

    private static readonly OUTPUT_DIRECTORY: string = './condensed_reviews'

    public static condenseFiles(): void {
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./reviews");
        const condensedReviews: any[] = [];
        let fileCount = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: any[] = FileService.readFileJSON(filePath, true);
            condensedReviews.push(...reviews);
            if (condensedReviews.length > this.MIN_REVIEWS_PER_FILE) {
                const fileName: string = `${this.OUTPUT_DIRECTORY}/condensed-${fileCount}.json.gz`;
                fileCount++;
                console.log(fileCount);
                FileService.writeFileJSON(fileName, condensedReviews, true);
                condensedReviews.length = 0;
            }
        }
        if (condensedReviews.length > 0) {
            const fileName: string = `${this.OUTPUT_DIRECTORY}/condensed-${fileCount}.json.gz`;
            fileCount++;
            console.log(fileCount);
            FileService.writeFileJSON(fileName, condensedReviews, true);
            condensedReviews.length = 0;
        }
        console.log("finished running condenser");
        console.log("finished with a total of " + (fileCount + 1) + " files after condensing")
    }

    public static trimIndividualReviews(): void {
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./reviews");
        const trimmedReviews: Review[] = [];
        let numSkipped: number = 0;
        let fileCount: number = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: any[] = FileService.readFileJSON(filePath, true);
            const appID: string = filePath.split("part")[0].replace("./reviews/", "");
            for (const review of reviews) {
                if (!review || !(review.author)) {
                    continue;
                }
                const isPositiveRecommendation: boolean = review.voted_up;
                const playTimeHoursAtReview: number = review.author.playtime_at_review;
                const playTimeHoursCurrent: number = review.author.playtime_forever;
                const hasPlayedSinceReview: boolean = playTimeHoursAtReview != playTimeHoursCurrent;
                const wasWrittenDuringEarlyAccess: boolean = review.written_during_early_access;
                const timestampCreated: number = review.timestamp_created;
                const timestampUpdated: number = review.timestamp_updated;
                const isReviewUpdated: boolean = timestampCreated != timestampUpdated;
                const timestampLastPlayed: number = review.author.last_played
                let survivalTime: number = timestampLastPlayed - timestampCreated;
                if (!hasPlayedSinceReview) {
                    const DATA_RETREIVAL_TIMESTAMP: number = (new Date("2026-06-07T00:00:00.000Z")).getTime() / 1_000;
                    survivalTime = DATA_RETREIVAL_TIMESTAMP - timestampCreated;
                }
                if (!this.hasAllValues(isPositiveRecommendation, playTimeHoursAtReview, playTimeHoursCurrent, hasPlayedSinceReview, wasWrittenDuringEarlyAccess, timestampCreated, timestampUpdated, isReviewUpdated, timestampLastPlayed)) {
                    numSkipped++;
                    continue;
                }
                const trimmedReview: Review = {
                    isPositiveRecommendation: isPositiveRecommendation,
                    playTimeHoursAtReview: playTimeHoursAtReview,
                    playTimeHoursCurrent: playTimeHoursCurrent,
                    hasPlayedSinceReview: hasPlayedSinceReview,
                    wasWrittenDuringEarlyAccess: wasWrittenDuringEarlyAccess,
                    timestampCreated: timestampCreated,
                    timestampUpdated: timestampUpdated,
                    isReviewUpdated: isReviewUpdated,
                    steamAppID: appID,
                    survivalTime
                }
                trimmedReviews.push(trimmedReview);
            }
            if (trimmedReviews.length > 1_000_000) {
                fileCount++;
                FileService.writeFileJSON(`./final_reviews/all_reviews${fileCount}.json`, trimmedReviews, false);
                trimmedReviews.length = 0;
                console.log(`wrote file ${fileCount}`)
            }
        }
        console.log(`Number of reviews skipped: ${numSkipped}\nnumber of reviews in final file ${trimmedReviews.length}`);
        fileCount++;
        FileService.writeFileJSON(`./final_reviews/all_reviews${fileCount}.json`, trimmedReviews, false);
    }

    private static hasAllValues(...values: unknown[]): boolean {
        return values.every(v => v !== null && v !== undefined);
    }

}

FileCondenser.trimIndividualReviews();
//console.log((new Date("2026-06-07T00:00:00.000Z")).getTime())
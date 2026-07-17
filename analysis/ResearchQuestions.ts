import { Review } from "../types/Review";
import { FileService } from "../utilities/FileService";
import kstest from '@stdlib/stats/kstest';
import wilcoxon from '@stdlib/stats-wilcoxon';
import chi2test from "@stdlib/stats/chi2test";

export class ResearchQuestions {

    public static questionOne(): void {
        console.log("--------------------------- STARTING QUESTION 1 ------------------------------")
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./final_reviews");

        const keyList: string[] = [];
        const map: Map<string, any> = new Map<string, any>();
        for (const filePath of allReviewsFilePaths) {

            const reviews: Review[] = FileService.readFileJSON(filePath);
            for (const review of reviews) {
                let currentValue: any = map.get(review.steamAppID);
                if (!currentValue) {
                    keyList.push(review.steamAppID);
                    currentValue = {
                        positiveEA: 0,
                        negativeEA: 0,
                        positiveRelease: 0,
                        negativeRelease: 0
                    };
                }
                if (review.wasWrittenDuringEarlyAccess) {
                    if (review.isPositiveRecommendation) {
                        currentValue.positiveEA++;
                    } else {
                        currentValue.negativeEA++;
                    }
                } else {
                    if (review.isPositiveRecommendation) {
                        currentValue.positiveRelease++;
                    } else {
                        currentValue.negativeRelease++;
                    }
                }
                map.set(review.steamAppID, currentValue);
            }
        }

        // ASSUMPTION CHECKING FOR NORMALITY
        const earlyAccessPositiveRates: number[] = [];
        const releasePositiveRates: number[] = [];
        for (const key of keyList) {
            const value = map.get(key);
            if (value.positiveEA + value.negativeEA >= 20 && value.positiveRelease + value.negativeRelease >= 20) {
                earlyAccessPositiveRates.push(value.positiveEA / (value.positiveEA + value.negativeEA));
                releasePositiveRates.push(value.positiveRelease / (value.positiveRelease + value.negativeRelease));
            }
        }
        
        console.log(`${earlyAccessPositiveRates.length} games that have 20+ reviews during and after early access`);

        const diffs: number[] = [];
        for (let i = 0; i < earlyAccessPositiveRates.length; i++) {
            diffs.push(releasePositiveRates[i] - earlyAccessPositiveRates[i]);
        }

        const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const diffSd = Math.sqrt(
            diffs.reduce((s, v) => s + (v - diffMean) ** 2, 0) / (diffs.length - 1)
        );
        const normalityResult = kstest(diffs, 'normal', diffMean, diffSd);
        console.log(`Test for normality (we want this >= 0.05): ${normalityResult.pValue}`);

        // normality test failed, therefore we instead use nonparametric
        const resultsWilcoxon = wilcoxon(earlyAccessPositiveRates, releasePositiveRates, {
            'alternative': 'two-sided',
            'exact': true
        });
        console.log("wilcoxon results for question 1:");
        console.log(resultsWilcoxon)
        const medianEA: number = this.getMedian(earlyAccessPositiveRates);
        const medianRelease: number = this.getMedian(releasePositiveRates);
        const medianDiff: number = this.getMedian(diffs);
        console.log(`EA median: ${medianEA}, release median: ${medianRelease}, diff median: ${medianDiff}`);

    }

    public static questionTwo(): void {
        console.log("--------------------------- STARTING QUESTION 2 ------------------------------")
        const DATA_RETREIVAL_TIMESTAMP_SECONDS: number = (new Date("2026-06-07T00:00:00.000Z")).getTime() / 1_000;
        const SECONDS_IN_ONE_YEAR: number = 60 * 60 * 24 * 365;
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./final_reviews");
        let newReviewReturned: number = 0;
        let newReviewUnreturned: number = 0;
        let midReviewReturned: number = 0;
        let midReviewUnreturned: number = 0;
        let oldReviewReturned: number = 0;
        let oldReviewUnreturned: number = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: Review[] = FileService.readFileJSON(filePath);
            for (const review of reviews) {
                const timeSinceReview: number = DATA_RETREIVAL_TIMESTAMP_SECONDS - review.timestampCreated;
                if (timeSinceReview < 3 * SECONDS_IN_ONE_YEAR) {
                    if (review.hasPlayedSinceReview) {
                        newReviewReturned++;
                    } else {
                        newReviewUnreturned++;
                    }
                } else if (timeSinceReview < 6 * SECONDS_IN_ONE_YEAR) {
                    if (review.hasPlayedSinceReview) {
                        midReviewReturned++;
                    } else {
                        midReviewUnreturned++;
                    }
                } else {
                    if (review.hasPlayedSinceReview) {
                        oldReviewReturned++;
                    } else {
                        oldReviewUnreturned++;
                    }
                }
            }
        }
        const observed: number[][] = [
            [newReviewReturned, newReviewUnreturned],
            [midReviewReturned, midReviewUnreturned],
            [oldReviewReturned, oldReviewUnreturned]
        ]
        console.log(`new ${newReviewReturned} ${newReviewUnreturned} mid ${midReviewReturned} ${midReviewUnreturned} old ${oldReviewReturned} ${oldReviewUnreturned}`)
        const results = chi2test(observed);

        console.log(results.toString());
    }

    public static questionThree(): void {
        console.log("--------------------------- STARTING QUESTION 3 ------------------------------")
        const DATA_RETREIVAL_TIMESTAMP_SECONDS: number = (new Date("2026-06-07T00:00:00.000Z")).getTime() / 1_000;
        const SECONDS_IN_ONE_YEAR: number = 60 * 60 * 24 * 365;
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./final_reviews");
        let newReviewUpdated: number = 0;
        let newReviewUnupdated: number = 0;
        let midReviewUpdated: number = 0;
        let midReviewUnupdated: number = 0;
        let oldReviewUpdated: number = 0;
        let oldReviewUnupdated: number = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: Review[] = FileService.readFileJSON(filePath);
            for (const review of reviews) {
                const timeSinceReview: number = DATA_RETREIVAL_TIMESTAMP_SECONDS - review.timestampCreated;
                if (timeSinceReview < 3 * SECONDS_IN_ONE_YEAR) {
                    if (review.isReviewUpdated) {
                        newReviewUpdated++;
                    } else {
                        newReviewUnupdated++;
                    }
                } else if (timeSinceReview < 6 * SECONDS_IN_ONE_YEAR) {
                    if (review.isReviewUpdated) {
                        midReviewUpdated++;
                    } else {
                        midReviewUnupdated++;
                    }
                } else {
                    if (review.isReviewUpdated) {
                        oldReviewUpdated++;
                    } else {
                        oldReviewUnupdated++;
                    }
                }
            }
        }
        const observed: number[][] = [
            [newReviewUpdated, newReviewUnupdated],
            [midReviewUpdated, midReviewUnupdated],
            [oldReviewUpdated, oldReviewUnupdated]
        ]
        console.log(`new ${newReviewUpdated} ${newReviewUnupdated} mid ${midReviewUpdated} ${midReviewUnupdated} old ${oldReviewUpdated} ${oldReviewUnupdated}`)
        const results = chi2test(observed);

        console.log(results.toString());
    }

    public static questionFour(): void {
        console.log("--------------------------- STARTING QUESTION 4 ------------------------------")
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./final_reviews");
        let updatedPositive: number = 0;
        let updatedNegative: number = 0;
        let defaultPositive: number = 0;
        let defaultNegative: number = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: Review[] = FileService.readFileJSON(filePath);
            for (const review of reviews) {
                if (review.isReviewUpdated) {
                    if (review.isPositiveRecommendation) {
                        updatedPositive++;
                    } else {
                        updatedNegative++;
                    }
                } else {
                    if (review.isPositiveRecommendation) {
                        defaultPositive++;
                    } else {
                        defaultNegative++;
                    }
                }
            }
        }
        const observed: number[][] = [
            [updatedPositive, updatedNegative],
            [defaultPositive, defaultNegative]
        ]
        console.log(`updated ${updatedPositive} ${updatedNegative} default ${defaultPositive} ${defaultNegative}`)
        const results = chi2test(observed);

        console.log(results.toString());
    }

    // == -------------------------------- helper ------------------------------------ == //

    private static getMedian(arr: number[]): number {
        const sortedDiffs = [...arr].sort((a, b) => a - b);
        const median = sortedDiffs.length % 2 === 0
            ? (sortedDiffs[sortedDiffs.length/2 - 1] + sortedDiffs[sortedDiffs.length/2]) / 2
            : sortedDiffs[Math.floor(sortedDiffs.length/2)];
        return median;
    }

}

// ResearchQuestions.questionOne();

//ResearchQuestions.questionTwo();

// ResearchQuestions.questionThree();

ResearchQuestions.questionFour();

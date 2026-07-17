/**
 * Standardized object to hold only the necessary information for the each of the reviews.
 */
export interface Review {

    isPositiveRecommendation: boolean;

    playTimeHoursAtReview: number;

    playTimeHoursCurrent: number;

    hasPlayedSinceReview: boolean;

    survivalTime: number;

    wasWrittenDuringEarlyAccess: boolean;

    timestampCreated: number;

    timestampUpdated: number;

    isReviewUpdated: boolean;

    steamAppID: string;

}
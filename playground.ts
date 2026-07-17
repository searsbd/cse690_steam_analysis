import { FileService } from "./utilities/FileService";

/**
 * Class that contains various testing methods that are not actively
 * needed for analysis
 */
export class Playground {
    
    /**
     * Prints the contents of a file
     * 
     * @param path The path to the file you want to open
     * @param isCompressed if the file is compressed
     */
    public static printFileContents(path: string, isCompressed: boolean = true): void {
        const reviews: any = FileService.readFileJSON(path, isCompressed);
        console.log(reviews);
        //console.log(reviews.indexOf(275850))
    }

    /**
     * Checks the entire contents of the reviews directory and prints the count
     * of the total number off reviews
     */
    public static countCurrentReviewCount(): void {
        const allReviewsFilePaths: string[] = FileService.getDirectoryContents("./final_reviews");
        let reviewCount: number = 0;
        for (const filePath of allReviewsFilePaths) {
            const reviews: any[] = FileService.readFileJSON(filePath);
            reviewCount += reviews.length;
        }
        console.log(reviewCount);
    }

}

Playground.printFileContents('./reviews/10part1.json.gz');

//Playground.printFileContents('./intermediary_files/ids.json', false);

//Playground.countCurrentReviewCount();

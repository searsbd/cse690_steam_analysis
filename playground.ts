import { FileService } from "./utilities/FileService";

const reviews: any = FileService.readFileJSON('./reviews/50part1.json.gz', true);
console.log(reviews);
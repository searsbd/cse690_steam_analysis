import fs from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

/**
 * Utility class used for dealing with files. Wrapper for tasks such
 * as reading and writing files, both compressed and plaintext.
 */
export class FileService {

    /**
     * Takes in a file path and whether or not it is compressed and returns its plaintext
     * contents
     * 
     * @param fileName the file path string of the file you want to open
     * @param isCompressed whether or not the file that you are trying to read is compressed
     * @returns the plaintext contents of the file that you specified
     */
    public static readFileString(fileName: string, isCompressed: boolean = false): string {
        if (!isCompressed) {
            const plaintextData: string = fs.readFileSync(fileName, 'utf-8');
            return plaintextData;
        } else {
            const compressedBuffer: Buffer = fs.readFileSync(fileName);
            const decompressedBuffer: Buffer = gunzipSync(compressedBuffer);
            const originalData: string = decompressedBuffer.toString('utf-8');
            return originalData;
        }
    }

    /**
     * Reads a file and returns the json contained with in, works for compressed
     * and uncompressed files
     * 
     * @param fileName The name of the file you want to read
     * @param isCompressed Whether or not that file is compressed
     * @returns The JSON contained in that file
     */
    public static readFileJSON(fileName: string, isCompressed: boolean = false): JSON {
        const plaintextContents: string = FileService.readFileString(fileName, isCompressed);
        return JSON.parse(plaintextContents);
    }

    /**
     * Writes the specified contents to the given file name, with the option to
     * compress it.
     * 
     * @param fileName the name of the file you want to write to
     * @param compressFile whether or not you should compress the file
     */
    public static writeFileString(fileName: string, fileContents: string, compressFile: boolean = false): void {
        if (!compressFile) {
            fs.writeFileSync(fileName, fileContents, 'utf-8')
        } else {
            const compressedFileContents: Buffer = gzipSync(fileContents)
            fs.writeFileSync(fileName, compressedFileContents);
        }
    }

    /**
     * Takes in JSON and a file name and writes the file, can compress file.
     * 
     * @param fileName The name of the file that you want to write to
     * @param fileContents the json information of the file you want to write
     * @param compressFile Whether or not you want to compress the file.
     */
    public static writeFileJSON(fileName: string, fileContents: JSON, compressFile: boolean = false): void {
        const stringFileContents: string = JSON.stringify(fileContents);
        FileService.writeFileString(fileName, stringFileContents, compressFile);
    }

}

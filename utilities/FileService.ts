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
    public static readFile(fileName: string, isCompressed: boolean = false): string {
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
     * Writes the specified contents to the given file name, with the option to
     * compress it.
     * 
     * @param fileName the name of the file you want to write to
     * @param compressFile whether or not you should compress the file
     */
    public static writeFile(fileName: string, fileContents: string, compressFile: boolean = false): void {
        if (!compressFile) {
            fs.writeFileSync(fileName, fileContents, 'utf-8')
        } else {
            const compressedFileContents: Buffer = gzipSync(fileContents)
            fs.writeFileSync(fileName, compressedFileContents);
        }
    }

}

import { Infer } from "../core/table";
export declare const PostTable: import("../core/table").Table<{
    id: number;
    title: string;
    content: string;
    authorid: number;
}>;
export type Post = Infer<typeof PostTable> & {
    users?: any;
};

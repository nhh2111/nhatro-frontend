export interface Task {
    id?: number;
    house_id?: number;
    room_id?: number;
    title: string;
    content: string;
    status: string;
    created_at?: string;
    finished_at?: string;
    owner_id: number;
}
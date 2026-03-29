export interface Room {
    id?: number;
    house_id?: number;
    room_number: string;
    floor: number;
    width: number;
    length: number;
    base_price: number;
    max_occupants: number;
    gender_restriction: string;
    status: string;
    description: string;
    images: string;
}
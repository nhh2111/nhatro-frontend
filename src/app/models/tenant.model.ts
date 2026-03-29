export interface Tenant {
    id?: number;
    full_name: string;
    cccd: string;
    phone: string;
    dob?: string;
    gender: string;
    motorbike_count: number;
    car_count: number;
    address: string;
    license_plates: string;
    image_url: string;
    created_at?: string;
}
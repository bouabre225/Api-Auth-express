export class AuthDto {
    constructor(user) {
        this.id = user.id
        this.email = user.email
        this.firstName = user.firstName
        this.lastName = user.lastName
    }

    static transform(data) {
        if (Array.isArray(data)) return data.map((user) => new AuthDto(user))
        
        return new AuthDto(data)
    }
}
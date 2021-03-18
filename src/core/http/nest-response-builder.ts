import { NestResponse } from "./nest-response";

export class NestResponseBuilder {
    private response: NestResponse = {
        status: 200,
        headers: {},
        body: {}
    }

    setStatus (statusCode: number) {
        this.response.status = statusCode;
        return this;
    }

    setHeaders (headers: object) {
        this.response.headers = headers;
        return this;
    }

    setBody (body: object) {
        this.response.body = body;
        return this;
    }

    build () {
        return new NestResponse(this.response)
    }
}
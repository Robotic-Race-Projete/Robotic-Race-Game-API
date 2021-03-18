import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { AbstractHttpAdapter, HttpAdapterHost } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators'
import { NestResponse } from "./nest-response";

@Injectable()
export class ResponseTransformerInterceptor implements NestInterceptor {

    private httpAdapter: AbstractHttpAdapter

    constructor (
        private adapterHost: HttpAdapterHost
    ) {
        this.httpAdapter = adapterHost.httpAdapter;
    }

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        return next.handle().pipe(
            map((responseController: NestResponse) => {
                if (responseController instanceof NestResponse) {
                    const ctx = context.switchToHttp();
                    const response = ctx.getResponse();
                    const { headers, status, body } = responseController;

                    const headersNames = Object.getOwnPropertyNames(headers);
                    headersNames.forEach(headerName => {
                        const headerValue = headers[headerName];
                        this.httpAdapter.setHeader(response, headerName, headerValue);
                    });

                    this.httpAdapter.status(response, status);

                    return body;
                }

                return NestResponse
            })
        )
    }
    
}
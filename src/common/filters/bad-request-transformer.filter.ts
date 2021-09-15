import { ArgumentsHost, BadRequestException, Catch } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(BadRequestException)
export class BadRequestTransformationFilter extends BaseWsExceptionFilter {
	catch(exception: BadRequestException, host: ArgumentsHost) {
		const client = host.switchToWs().getClient();
		console.log(exception.getResponse());
		client.emit('exception', exception.getResponse());

		const properError = new WsException(exception.getResponse());
		super.catch(properError, host);
	}
}
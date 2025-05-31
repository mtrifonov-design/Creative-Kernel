import { Message, MessageT, SerializedMessage, SerializedMessageT } from "../../messaging/src/base/message";
import { Address, AddressT } from "../../messaging/src/base/address";
import { Effect } from "effect";
import { UUID } from "../../messaging/src/base/uuid";
import { send } from "../../messaging/src/base/index";
import { CommunicationChannelT, registerCommunicationChannel } from "../../messaging/src/base/communication_channels";

const sendMessage = (message: Message) => {
    return send.pipe(
        Effect.provideService(
            MessageT,
            message
        ),
        Effect.runPromise
    );
}

class LocalAddress extends Address {
    constructor(id: string) {
        super(Address.local_address().primary_id, id as UUID);
    }
}

const EffectlessRegisterCommunicationChannel = (
    address: Address,
    recieve_cb: (handle_message: (serizalized_message: string) => void) => void,
    send_fun: (message: string) => void
) => {
    return Effect.runPromise(
        registerCommunicationChannel.pipe(
            Effect.provideService(
                CommunicationChannelT,
                {
                    direction: "INOUT",
                    recieve_cb: (recieve_effect: Effect.Effect<void, void, SerializedMessageT>) => {
                        recieve_cb((serizalized_message: string) => {
                            Effect.runPromise(
                                recieve_effect.pipe(
                                    Effect.provideService(
                                        SerializedMessageT,
                                        serizalized_message as SerializedMessage
                                    )
                                )
                            )
                        })
                    },
                    send: Effect.gen(function* () {
                        const message = yield* SerializedMessageT;
                        send_fun(message);
                    })
                }
            ),
            Effect.provideService(
                AddressT,
                address
            )
        )
    )
}

const deeffectSync = (effect: Effect.Effect<any, any>) => {
    return Effect.runSync(effect);
}

const deeffect = (effect: Effect.Effect<any, any>) => {
    return Effect.runPromise(effect);
}

const serializeMsg = (message: Message) => {
    return message.serialize().pipe(
        Effect.runSync
    )
}

export {
    Message,
    Address,
    serializeMsg,
    LocalAddress,
    sendMessage,
    deeffectSync,
    deeffect,
    EffectlessRegisterCommunicationChannel as registerCommunicationChannel
};
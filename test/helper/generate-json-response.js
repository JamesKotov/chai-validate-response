import {Response} from "whatwg-fetch";

export default (body = {}, status = 200) => {
    const _body = status === 204 ? {} : body;
    const options = {
        status: status
    };
    if (status !== 204) {
        options.headers = {
            "Content-Type": "application/json"
        };
    }
    return new Response(JSON.stringify(_body), options);
};
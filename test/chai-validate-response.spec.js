"use strict";

import chai, { expect } from "chai";
import chaiValidateResponse from "../src/chai-validate-response";
import chaiAsPromised from "chai-as-promised";
import generateSchema from "./helper/generate-schema";
import generateJsonResponse from "./helper/generate-json-response";
import express from "express";
import supertest from "supertest";
import * as path from "path";
import {addValidationFormat} from "../src/chai-validate-response";
import isUrl from "is-url";
import isEmail from "is-email";

addValidationFormat("uuid", function (str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
});
addValidationFormat("url", function (str) {
    return isUrl(str);
});
addValidationFormat("email", function (str) {
    return isEmail(str);
});
addValidationFormat("xstring", function (str) {
    return str === "xxx";
});

chai.use(chaiValidateResponse);

const schema = generateSchema({
    type: "object",
    properties: {
        foo: { type: "boolean" }
    },
    required: ["foo"]
});

const openapiSchemaPath = path.join(__dirname, "./helper/openapi.yaml");

describe("chai-validate-response", () => {

    describe("expect(response).to.be.a.validResponse(schema, path, method)", () => {

        it("should validate a valid json response", (done) => {
            let response = generateJsonResponse({ foo: true });

            expect(response).to.be.a.validResponse(schema, "/", "get").andNotifyWhen(done);
        });

        it("should validate an invalid json response", (done) => {
            let response = generateJsonResponse({ foo: null });

            expect(response).not.to.be.a.validResponse(schema, "/", "get").andNotifyWhen(done);
        });

        it("should work with express / superagent", (done) => {
            let app = express();
            app.get("/", (req, res) => res.status(200).json({ foo: true }));

            supertest(app)
                .get("/")
                .expect(200)
                .then((res) => expect(res).to.be.a.validResponse(schema, "/", "get").andNotifyWhen(done));
        });

        it("should work with the chai-as-promised plugin", (done) => {
            chai.use(chaiAsPromised);

            let response = generateJsonResponse({ foo: null });

            expect(Promise.resolve(response)).to.eventually.not.be.a.validResponse(schema, "/", "get").and.be.rejected.and.notify(done);
        });

        it("should supports openapi 3.0 schema for response validation", (done) => {
            const response = generateJsonResponse([
                {
                    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
                    "name": "Widget Adapter",
                    "releaseDate": "2016-08-29T09:12:33.001Z",
                    "manufacturer": {
                        "name": "ACME Corporation",
                        "homePage": "https://www.acme-corp.com",
                        "phone": "408-867-5309",
                        "email": "john@doe.com",
                        "misc": "xxx"
                    }
                }
            ]);
            expect(response).to.be.a.validResponse(openapiSchemaPath, "/inventory", "get").andNotifyWhen(done);
        });

        it("should supports openapi 3.0 schema with 204 code for response validation", (done) => {
            const response = generateJsonResponse("", 204);
            expect(response).to.be.a.validResponse(openapiSchemaPath, "/inventory/{id}", "delete").andNotifyWhen(done);
        });

        it("should supports openapi 3.0 schema with allOf", (done) => {
            const response = generateJsonResponse({
                "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
                "name": "Widget Adapter",
                "releaseDate": "2016-08-29T09:12:33.001Z",
                "manufacturer": {
                    "name": "ACME Corporation",
                    "homePage": "https://www.acme-corp.com",
                    "phone": "408-867-5309",
                    "email": "john@doe.com",
                    "misc": "xxx"
                }
            });
            expect(response).to.be.a.validResponse(openapiSchemaPath, "/inventory/{id}", "get").andNotifyWhen(done);
        });

        it("should test for required fields", (done) => {
            const response = generateJsonResponse({
                "categorie": [
                    {
                        "category_id": "765d2ab2-6fa6-4ca0-baf5-2f0c713fd0f7",
                        "title": "Услуги",
                        "content": [
                            {
                                "key": "telco",
                                "title": "telco",
                                "type": "telco",
                                "logo": "http://humans.net/logo.jpg",
                                "values": [
                                    {
                                        "value": "Phone"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
            expect(response).to.be.a.validResponse(openapiSchemaPath, "/categories", "get").andNotifyWhen(done);
        });

        it("should fail without for required fields", (done) => {
            const response = generateJsonResponse({
                "categorie": [
                    {
                        "category_id": "765d2ab2-6fa6-4ca0-baf5-2f0c713fd0f7",
                        "title": "Услуги",
                        "content": [
                            {
                                "logo": "http://humans.net/logo.jpg",
                                "values": [
                                    {
                                        "value": "Phone"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
            expect(response).not.to.be.a.validResponse(openapiSchemaPath, "/categories", "get").andNotifyWhen(done);
        });

    });

    describe("expect(response).to.be.a.validResponseBody(schema, path, method, status, contentType)", () => {
        it("should validate a valid json response", (done) => {
            let responseBody = { foo: true };

            expect(responseBody).to.be.a.validResponseBody(schema, "/", "get", 200, "application/json");
            done();
        });


        it("should validate an invalid json response", (done) => {
            let responseBody = { foo: null };

            expect(responseBody).not.to.be.a.validResponseBody(schema, "/", "get", 200, "application/json");
            done();
        });
    });


});
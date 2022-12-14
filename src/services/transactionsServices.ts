import Cryptr from 'cryptr';
import { findById } from "../repositories/businessRepository";
import { Card, findByCardDetails } from "../repositories/cardRepository";
import { findByCardId as findPayments, insert as insertPayment } from "../repositories/paymentRepository";
import { findByCardId as findRecharges, insert as insertRecharge } from "../repositories/rechargeRepository";
const cryptr = new Cryptr('myTotallySecretKey');

export async function isActiveCard(card: Card) {
    if(card.password) {
        return
    }
    throw { type: "registred", message: "Card not activated" }
}

export async function rechargeCard(card: Card, amount: number) {
    const recharge = {cardId: card.id, amount}
    await insertRecharge(recharge)
}

export async function isBlocked(card: Card) {
    if(card.isBlocked) {
        throw { type: "denied", message: "Card blocked" }
    }
}

export async function isRegisteredBusiness(id: number) {
    const business = await findById(id);

    if(business) {
        return business
    }
    throw { type: "not found", message: "Business not registered" }
}

export async function compareShopCardType(shopType: string, cardType: string) {
    if(shopType !== cardType) {
        throw { type: "denied", message: "Card not allowed to buy in this business" }
    }
}

export async function checkBalance(id: number, amount?: number) {
    const incomeArray = await findRecharges(id);
    const outcomeArray = await findPayments(id);
    let income = 0;
    let outcome = 0;

    for(let i = 0; i < incomeArray.length; i++) {
        income += incomeArray[i].amount;
    }

    for(let i = 0; i < outcomeArray.length; i++) {
        outcome += outcomeArray[i].amount;
    }
    
    const balance = income - outcome;

    if(!amount) {
        return {balance, incomeArray, outcomeArray}

    } else if(balance - amount < 0) {
        throw { type: "denied", message: "Not enough balance" }
    }
}

export async function purchase(cardId: number, businessId: number, amount: number) {
    await insertPayment({cardId, businessId, amount})
}

export async function isValidCard(number: string, cardholderName: string, expirationDate: string, cvv: string) {
    const card = await findByCardDetails(number, cardholderName, expirationDate);

    if(card && cryptr.decrypt(card.securityCode) === cvv) {
        return card
    }

    throw { type: "not found", message: "Invalid card" }
}
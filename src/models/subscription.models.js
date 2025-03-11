import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,//one who suscribine 
        ref: "User"
    },
    channe: {
        type: Schema.Types.ObjectId,//one whose channel 
        ref: "User"
    },


}, {timestamps: true});

export default mongoose.model("Subscription", subscriptionSchema);
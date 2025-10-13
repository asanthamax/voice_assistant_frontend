import clsx from "clsx";
import { useContext, useState } from "react";
import { AppContext } from "../context";

export default function StatusIndicator () {
    const { connectionStatus } = useContext(AppContext);
    
    return (
        <div id="status" className="status disconnected">
            {connectionStatus.type === 'connected' && (
                <>
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                {connectionStatus.message}
                </>
            )}
            {connectionStatus.type === 'disconnected' && (
                <>
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                {connectionStatus.message}
                </>
            )}
            {connectionStatus.type === 'connecting' && (
                <>
                <div className="w-3 h-3 bg-yellow-600 rounded-full animate-spin"></div>
                {connectionStatus.message}
                </>
            )}
        </div>
    )
}
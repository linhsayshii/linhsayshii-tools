import React from 'react';

const Tabs = React.forwardRef(({ className, children, ...props }, ref) => (
    <div ref={ref} className={`w-full ${className}`} {...props}>
        {children}
    </div>
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={`inline-flex h-10 items-center justify-center rounded-md bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))] ${className}`}
        {...props}
    />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, activeValue, onClick, ...props }, ref) => (
    <button
        ref={ref}
        role="tab"
        aria-selected={value === activeValue}
        onClick={() => onClick && onClick(value)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-[hsl(var(--background))] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${value === activeValue
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                : 'hover:bg-[hsl(var(--background))]/50 hover:text-[hsl(var(--foreground))]'
            } ${className}`}
        {...props}
    />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, activeValue, children, ...props }, ref) => {
    if (value !== activeValue) return null;
    return (
        <div
            ref={ref}
            className={`mt-2 ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

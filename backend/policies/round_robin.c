#include <stdio.h>
#include "../include/process.h"
#include "../include/colors.h"

void round_robin_display(Process p[], int n, int quantum) {
    int remaining[100], waiting[100], turnaround[100];
    for(int i = 0; i < n; i++) remaining[i] = p[i].burst;

    printf("\n================ Round Robin Scheduler (Quantum = %d) =================\n", quantum);

    printf("%-5s %-10s %-8s %-6s\n", "ID", "Process", "Arrival", "Burst");
    printf("-------------------------------------------------\n");
    for(int i = 0; i < n; i++)
        printf("%-5d %-10s %-8d %-6d\n", i+1, p[i].name, p[i].arrival, p[i].burst);

    int total_time = 0;
    for(int i = 0; i < n; i++)
        if(total_time < p[i].arrival) total_time = p[i].arrival;
    for(int i = 0; i < n; i++) total_time += p[i].burst;

    int queue[100], front = 0, rear = 0;
    int completed = 0, time = 0;

    for(int i = 0; i < n; i++)
        if(p[i].arrival == 0)
            queue[rear++] = i;

    for(int i = 0; i < n; i++) waiting[i] = 0;

    printf("\nGantt Chart:\n");

    while(completed < n) {

        if(front == rear) {
            time++;
            for(int i = 0; i < n; i++)
                if(p[i].arrival == time)
                    queue[rear++] = i;
            continue;
        }

        int idx = queue[front++];
        int exec = (remaining[idx] > quantum) ? quantum : remaining[idx];

        printf("%-6s: ", p[idx].name);
        for(int t = 0; t < total_time; t++) {
            if(t >= time && t < time + exec)
                printf("%s█%s ", colors[idx % 6], RESET);
            else
                printf(" . ");
        }
        printf("\n");

        if(waiting[idx] == 0 && time > p[idx].arrival)
            waiting[idx] = time - p[idx].arrival;

        remaining[idx] -= exec;
        int old_time = time;
        time += exec;

        for(int t = old_time + 1; t <= time; t++) {
            for(int i = 0; i < n; i++) {
                if(p[i].arrival == t)
                    queue[rear++] = i;
            }
        }

        if(remaining[idx] > 0)
            queue[rear++] = idx;
        else {
            turnaround[idx] = time - p[idx].arrival;
            completed++;
        }
    }

    printf("\nSummary:\n");
    printf("%-10s %-10s %-10s\n", "Process", "Waiting", "Turnaround");
    for(int i = 0; i < n; i++)
        printf("%-10s %-10d %-10d\n", p[i].name, waiting[i], turnaround[i]);

    printf("===============================================================\n");
    printf("End of Round Robin scheduling.\n\n");
}

void round_robin(Process p[], int n, int quantum) {
    round_robin_display(p, n, quantum);
}
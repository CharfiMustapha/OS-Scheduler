#include <stdio.h>
#include "../include/process.h"
#include "../include/colors.h"

void srtf(Process p[], int n) {
    int remaining[n];
    int waiting[n], turnaround[n];
    int completed = 0;
    int time = 0;

    for(int i = 0; i < n; i++) {
        remaining[i] = p[i].burst;
        waiting[i] = 0;
        turnaround[i] = 0;
    }

    printf("\n================ SRTF Scheduler (Preemptive) =================\n");

    printf("%-5s %-10s %-8s %-6s\n", "ID", "Process", "Arrival", "Burst");
    printf("-----------------------------------------------\n");
    for(int i = 0; i < n; i++)
        printf("%-5d %-10s %-8d %-6d\n", i+1, p[i].name, p[i].arrival, p[i].burst);

    int total_time = 0;
    for(int i = 0; i < n; i++)
        if(total_time < p[i].arrival) total_time = p[i].arrival;
    for(int i = 0; i < n; i++)
        total_time += p[i].burst;

    printf("\nGantt Chart:\n");
    printf("Time : ");
    for(int t = 0; t < total_time; t++) printf("%2d ", t);
    printf("\n");

    int gantt[n][total_time];
    for(int i = 0; i < n; i++)
        for(int t = 0; t < total_time; t++)
            gantt[i][t] = 0;

    while(completed < n) {
        int idx = -1;
        int min_remaining = 1e9;

        for(int i = 0; i < n; i++) {
            if(p[i].arrival <= time && remaining[i] > 0) {
                if(remaining[i] < min_remaining) {
                    min_remaining = remaining[i];
                    idx = i;
                }
            }
        }

        if(idx != -1) {
            gantt[idx][time] = 1;

            remaining[idx]--;
            if(remaining[idx] == 0) {
                completed++;
                turnaround[idx] = time + 1 - p[idx].arrival;
                waiting[idx] = turnaround[idx] - p[idx].burst;
            }
        }

        time++;
    }

    for(int i = 0; i < n; i++) {
        printf("%-6s: ", p[i].name);
        for(int t = 0; t < total_time; t++) {
            if(gantt[i][t])
                printf("%s█%s ", colors[i % 6], RESET);
            else
                printf(" . ");
        }
        printf("\n");
    }

    printf("\nSummary:\n");
    printf("%-10s %-10s %-10s\n", "Process", "Waiting", "Turnaround");
    for(int i = 0; i < n; i++)
        printf("%-10s %-10d %-10d\n", p[i].name, waiting[i], turnaround[i]);

    printf("================================================\n");
    printf("End of SRTF scheduling.\n\n");
}